import { Editor } from "@tinymce/tinymce-react";
import { forwardRef } from "react";

function JMEdtior({ value }, ref) {
  return (
    <Editor
      onEditorChange={(e) => {
        console.log("onEditorChange", e);
      }}
      ref={ref}
      apiKey="96zg9oy1vp6q8tkgboz3eqcxkbixe6y3ydaq8679s737lcuu"
      init={{
        plugins:
          "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount",
        toolbar:
          "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat",
      }}
      value={value}
      initialValue="Welcome to TinyMCE!"
    />
  );
}

export default forwardRef(JMEdtior);
