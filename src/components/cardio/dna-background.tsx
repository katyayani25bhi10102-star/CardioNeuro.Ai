export function DnaBackground() {
  return (
    <div className="dna-field" aria-hidden="true">
      <div className="dna-helix">
        {Array.from({ length: 16 }, (_, index) => <span key={index} style={{ "--i": index } as React.CSSProperties}><i /><b /></span>)}
      </div>
      <div className="particle-field" />
    </div>
  );
}
