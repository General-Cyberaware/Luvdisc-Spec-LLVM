import { motion } from "framer-motion";
import { Upload as UploadIcon, FileText, Check } from "lucide-react";

interface Props {
  file: File | null;
  dragOver: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadDropZone = ({ file, dragOver, onDrop, onDragOver, onDragLeave, onFileInput }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onDrop={onDrop}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    className={`glass-card p-12 text-center cursor-pointer transition-all ${
      dragOver ? "ring-2 ring-primary scale-[1.01]" : ""
    } ${file ? "border-primary/40" : ""}`}
    onClick={() => document.getElementById("file-input")?.click()}
  >
    <input id="file-input" type="file" accept=".ll" className="hidden" onChange={onFileInput} />
    {file ? (
      <div className="flex items-center justify-center gap-3">
        <FileText className="w-6 h-6 text-primary" />
        <span className="font-medium text-foreground">{file.name}</span>
        <Check className="w-5 h-5 text-success" />
      </div>
    ) : (
      <>
        <UploadIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          Drop your <span className="font-mono">.ll</span> file here or click to browse
        </p>
      </>
    )}
  </motion.div>
);

export default UploadDropZone;
