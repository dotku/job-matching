import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import WithErrorContent from "../common/WithErrorContent";
import { corporationDB } from "./CorporationJobBoards";

const defaultData = {
  get timestamp() {
    return new Date().getTime();
  },
};

export default function CorporationCreate() {
  const options = ["recruiting SAAS", "candidate pool"];
  const [formData, setFormData] = useState(defaultData);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckboxChange = (option) => (e) => {
    setFormData({
      ...formData,
      tags: {
        ...formData.tags,
        [option]: e.target.checked,
      },
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    console.log(formData);
    setIsSubmiting(true);
    const corporationTempRef = collection(corporationDB, "corporation_temp");
    try {
      const res = await addDoc(corporationTempRef, formData);
      if (res) {
        setIsSubmiting(false);
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
        e.target.reset();
        setFormData(defaultData);
      } else {
        setError(true);
      }
    } catch (e) {
      console.error(e);
      setIsSubmiting(false);
      setError(e);
    }
  };

  return (
    <>
      <form onSubmit={handleFormSubmit}>
        <input
          className="my-2 form-control"
          name="companyName"
          id="companyName"
          placeholder="corperation name"
          required
          onChange={handleChange}
        />
        <input
          className="my-2 form-control"
          name="companyTotalRegisteratedMember"
          placeholder="total reigistered member number"
          onChange={handleChange}
        />
        <input
          className="my-2 form-control"
          name="companyCandidatePoolNumber"
          placeholder="candidate pool number"
          onChange={handleChange}
        />
        <input
          className="my-2 form-control"
          name="companyAvaiableJobNumber"
          placeholder="avaiable jobs number"
          onChange={handleChange}
        />
        <input
          className="my-2 form-control"
          name="companyRegisteratedCoperationNumber"
          placeholder="registrated corporation number"
          onChange={handleChange}
        />
        <input
          className="my-2 form-control"
          name="companyRevenu"
          placeholder="revenue"
          onChange={handleChange}
        />
        {options.map((item, idx) => (
          <div className="form-check" key={idx}>
            <input
              className="form-check-input"
              type="checkbox"
              name="tags"
              value={item}
              id={`tags-${idx}`}
              onChange={handleCheckboxChange(item)}
            />
            <label className="form-check-label" htmlFor={`tags-${idx}`}>
              {item}
            </label>
          </div>
        ))}
        <button
          type="submit"
          className="btn btn-outline-dark my-3"
          disabled={isSubmiting}
        >
          Submit
        </button>
      </form>
      {isSuccess && (
        <div className="alert alert-success fade show" role="alert">
          Successfully submited.
        </div>
      )}
      {error && <WithErrorContent error={error} />}
    </>
  );
}
