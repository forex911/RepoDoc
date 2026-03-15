import { Icons } from "./Icons"

export default function DuplicateFiles({ duplicates }) {
  if (!duplicates || duplicates.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon icon icon-md">{Icons.copy}</span>
          <h2 className="card-title">Duplicate Files</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon icon icon-lg" style={{ color: "var(--success)" }}>{Icons.check}</div>
          No duplicate files detected
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.copy}</span>
        <h2 className="card-title">Duplicate Files</h2>
        <span className="card-subtitle">{duplicates.length} pairs</span>
      </div>
      <div>
        {duplicates.map((d, i) => {
          const name1 = d.file1.split(/[/\\]/).pop()
          const name2 = d.file2.split(/[/\\]/).pop()
          return (
            <div key={i} className="dup-pair">
              <div className="dup-label">File A</div>
              <div className="dup-file" title={d.file1}>{name1}</div>
              <div className="dup-separator"><span>matches</span></div>
              <div className="dup-label">File B</div>
              <div className="dup-file" title={d.file2}>{name2}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
