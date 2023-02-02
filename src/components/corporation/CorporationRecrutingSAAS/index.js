const data = ["Hired", "Woo.io", "LinkedIn", "Angel.co", "indeed", "Dice"];

export default function CorportaionRecrutingSAAS({ phrase }) {
  const results = data
    .filter((board) => (phrase ? board.match(new RegExp(phrase, "i")) : true))
    .map((board, key) => <li key={key}>{board}</li>);
  if (!results.length) return null;
  return (
    <div>
      <h2>Recruting SAAS</h2>
      <ul>{results}</ul>
    </div>
  );
}
