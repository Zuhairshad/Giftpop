import { redirectToBuilder } from "../redirect-to-builder";

type StepPageProps = Parameters<typeof redirectToBuilder>[0];

/** The builder is one page now; old step and share links (`?from=`) land there. */
export default async function ReviewStepPage(props: StepPageProps) {
  return redirectToBuilder(props);
}
