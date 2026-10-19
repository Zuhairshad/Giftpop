import { redirectToBuilder } from "../redirect-to-builder";

type StepPageProps = Parameters<typeof redirectToBuilder>[0];

/** The builder is one page now; old step links land there. */
export default async function ItemsStepPage(props: StepPageProps) {
  return redirectToBuilder(props);
}
