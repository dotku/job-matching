export default function Registration() {
  const handleRegistraionSubmit = (e) => {
    e.preventDefault();
    console.log("submit");
  };
  return (
    <form onSubmit={handleRegistraionSubmit} style={{ maxWidth: 300 }}>
      <h2>Registration</h2>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          className="form-control"
          id="email"
          placeholder="Email"
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          className="form-control"
          id="password"
          placeholder="Password"
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Confirm Password</label>
        <input
          type="password"
          className="form-control"
          id="password"
          placeholder="Password"
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Submit
      </button>
    </form>
  );
}
