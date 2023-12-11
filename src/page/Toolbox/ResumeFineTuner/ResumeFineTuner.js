import { Editor } from "@tinymce/tinymce-react";

export default function ResumeFineTuner() {
  return (
    <>
      <h2>Resume Fine Tuner</h2>
      <textarea className="resume-application"></textarea>
      <textarea className="resume-current"></textarea>
      <button>Generate New Resume</button>
      <Editor
        apiKey="96zg9oy1vp6q8tkgboz3eqcxkbixe6y3ydaq8679s737lcuu"
        init={{
          plugins:
            "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount",
          toolbar:
            "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat",
        }}
        initialValue="Welcome to TinyMCE!"
      />
    </>
  );
}
