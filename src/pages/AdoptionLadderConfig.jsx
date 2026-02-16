import Sidebar from "../components/Sidebar";
import AdoptionLadderBuilder from "../components/AdoptionLadderBuilder";

export default function AdoptionLadderConfig() {
  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">
              Adoption Ladder
            </h1>
            <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
              Define the stages HCPs move through, from unaware to advocate.
              Drag to reorder, click to expand and configure each stage.
            </p>
          </div>

          {/* Builder */}
          <AdoptionLadderBuilder />
        </div>
      </main>
    </div>
  );
}
