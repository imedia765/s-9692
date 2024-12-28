import { File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Document {
  name: string;
  uploadDate: string;
  type: string;
}

interface DocumentsSectionProps {
  documents: Document[];
  documentTypes: { type: string; description: string; }[];
}

export const DocumentsSection = ({ documents }: DocumentsSectionProps) => {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button 
          variant="default"
          className="flex items-center gap-2 w-full justify-between bg-primary hover:bg-primary/90"
        >
          <div className="flex items-center gap-2">
            <File className="h-4 w-4" />
            <span>Documents</span>
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Upload Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc, index) => (
                <TableRow key={index}>
                  <TableCell>{doc.name}</TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>{doc.uploadDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
};