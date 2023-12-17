import { Editor } from "@tinymce/tinymce-react";
import { forwardRef, useState } from "react";

function JMEdtior({ initialValue, onEditorChange, onChange }, ref) {
  const [value, setValue] = useState(initialValue ?? "");
  return (
    <Editor
      ref={ref}
      apiKey="96zg9oy1vp6q8tkgboz3eqcxkbixe6y3ydaq8679s737lcuu"
      init={{
        plugins:
          "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount",
        toolbar:
          "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat",
      }}
      initialValue={initialValue || "Welcome to TinyMCE!"}
      onEditorChange={(newValue, _editor) => setValue(newValue)}
    />
  );
}

export default forwardRef(JMEdtior);
