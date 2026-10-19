import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

/** Empty page for an area that a later phase fills in. */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="p-4 md:p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Nothing here yet</CardTitle>
            <CardDescription>This area is built in a later phase.</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">{description}</CardContent>
        </Card>
      </div>
    </>
  );
}
