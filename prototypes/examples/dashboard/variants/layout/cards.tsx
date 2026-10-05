import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PROJECTS } from "../../data"

export default function Cards({ dense }: { dense: boolean }) {
  return (
    <div className={`grid sm:grid-cols-2 ${dense ? "gap-3" : "gap-6"}`}>
      {PROJECTS.map((project) => (
        <Card key={project.name}>
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>Owned by {project.owner}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit">
              {project.status}
            </Badge>
            <Progress value={project.progress} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
