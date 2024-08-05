// @ts-nocheck
import { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
// import { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import {
  buildSelfDescribingEvent,
  gotEmitter,
  HttpMethod,
  HttpProtocol,
  tracker,
} from "@snowplow/node-tracker";

let t: any;
// This is all test code to try and get the async onEnd to work correctly.
// I also thought that I would pull out these functions and make them async to force it to not finish playwright early but it didn't work

const testResultsSchema = [];

export async function sendResults() {
  const data = {
    scenario_name: "it loads the web nav",
    feature_name: "test_title_name",
    repo_name: "playwright-repo",
    tags: "tbd",
    status: "passed",
    scenario_execution_seconds: 1300,
    test_type: "playwright_ui",
    teamcity_build_number: "futureENV",
    teamcity_build_id: "futureENV1",
    antioch_version: "1.42.0",
    branch: "test-branch",
    environment: "tbd",
    business_unit: "tbd",
    user: "futureUserEnv",
    error: undefined,
    error_message: undefined,
    context: "testContext",
  };
  const e = gotEmitter(
    // switch out collector endpoint for legit one
    "test-url-collector", // Collector endpoint
    HttpProtocol.HTTPS, // Protocol
    443,
    HttpMethod.POST, // Method
    1, // Buffer Size
    1,
    undefined,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    (error, response) => {
      if (error) {
        console.error("Error sending tracking event", error);
      }
      if (response) {
        console.log("response was good");
      }
    } // Retries
  );

  const t = tracker(e, "playwright_snowplow", "playwright", false);
  // console.log(schemaData);

  const finishedevent = t.track(
    buildSelfDescribingEvent({
      event: {
        schema: "iglu:com.hudl/antioch_scenario_data/jsonschema/2-0-0",
        data: data,
      },
    })
  );
  return finishedevent;
}
class SnowPlowReporter implements Reporter {
  runId: number;
  private reportPublish: Promise<void>[] = [];

  async onEnd(result: FullResult) {
    await Promise.all(this.reportPublish);
    console.log(`Finished the run: ${result.status}`);
  }
  // On test end doesn't appear to be async but on end is according to this thread: https://github.com/microsoft/playwright/issues/14452
  // we need to use promises in here in order to get all the test results.
  async onTestEnd(test: TestCase, result: TestResult) {
    const testReportData = new Promise<void>((resolve) => {
      setTimeout(() => {
        sendResults();
        resolve();
      }, 100);
    });
    this.reportPublish.push(testReportData);
    // testResultsSchema.push(schemaData);
  }
}
export default SnowPlowReporter;
