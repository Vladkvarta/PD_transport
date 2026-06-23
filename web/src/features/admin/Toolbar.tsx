import { Search } from "lucide-react";

interface ToolbarProps {
  search: string;
  setSearch: (value: string) => void;
}

export function Toolbar({ search, setSearch }: ToolbarProps) {
  return (
    <div className="toolbar">
      <Search size={18} />
      <input
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Поиск"
        value={search}
      />
    </div>
  );
}
