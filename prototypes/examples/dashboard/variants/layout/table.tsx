import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PROJECTS } from "../../data"

export default function ProjectTable({ dense }: { dense: boolean }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PROJECTS.map((project) => (
            <TableRow key={project.name}>
              <TableCell className={dense ? "py-1.5" : "py-4"}>
                {project.name}
              </TableCell>
              <TableCell>{project.owner}</TableCell>
              <TableCell>
                <Badge variant="secondary">{project.status}</Badge>
              </TableCell>
              <TableCell className="text-right">{project.progress}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
