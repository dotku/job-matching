export default function WithErrorContent({ children, error }) {
  return error ? (
    <div className="alert alert-danger">
      Something goes wrong, please come back later.
    </div>
  ) : (
    <>{children}</>
  );
}
