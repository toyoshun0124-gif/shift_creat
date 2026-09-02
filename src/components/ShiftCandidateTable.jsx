export default function ShiftCandidateTable({ candidate, onSelect }) {
  return (
    <div className="card candidate-card">
      <div className="candidate-header">
        <h4>案 {candidate.index}</h4>
        <button type="button" className="btn btn-primary" onClick={onSelect}>
          この案を選択して確定・共有する
        </button>
      </div>
      {candidate.assignments.length === 0 ? (
        <p className="muted">割り当てがありません</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>日付</th>
              <th>従業員</th>
              <th>開始</th>
              <th>終了</th>
            </tr>
          </thead>
          <tbody>
            {candidate.assignments.map((a) => (
              <tr key={a.id}>
                <td>{a.date}</td>
                <td>{a.user?.name} ({a.user?.loginId})</td>
                <td>{a.startTime}</td>
                <td>{a.endTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
