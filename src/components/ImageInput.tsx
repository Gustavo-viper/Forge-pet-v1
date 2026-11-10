import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button, Input, Photo } from "./ui";

/** Escolha de imagem por URL ou upload (redimensionado para caber no localStorage). */
export function ImageInput({ value, onChange, round }: { value: string; onChange: (v: string) => void; round?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const onFile = (file?: File) => {
    if (!file) return;
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const max = 640;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        onChange(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-center gap-4">
      <Photo src={value} alt="Pré-visualização" className={round ? "size-20 shrink-0 rounded-full" : "aspect-[4/3] w-28 shrink-0 rounded-2xl"} />
      <div className="flex-1 space-y-2">
        <Input placeholder="Cole a URL de uma imagem" value={value.startsWith("data:") ? "" : value} onChange={(e) => onChange(e.target.value)} className="h-11 text-sm" />
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button size="sm" variant="outline" onClick={() => ref.current?.click()} icon={<Upload className="size-4" />}>{value.startsWith("data:") ? "Trocar imagem enviada" : "Enviar do dispositivo"}</Button>
      </div>
    </div>
  );
}
