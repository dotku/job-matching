import React, { useRef, useState } from "react";
import Moment from "react-moment";

const defaultPosts = [
  {
    time: new Date().getTime() - Math.floor(Math.random() * 1000000),
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  },
  {
    time: new Date().getTime() - Math.floor(Math.random() * 10000000),
    content: "consectetur adipiscing elit",
  },
];

const MAX_LENGTH = 100;

export default function Social() {
  const [posts, setPosts] = useState(defaultPosts);
  const [postContent, setPostContent] = useState("");

  const handleSubmit = () => {
    if (!postContent) return;

    setPosts([
      {
        time: new Date().getTime(),
        content: postContent,
      },
      ...posts,
    ]);

    setPostContent("");
  };

  const handleTexareaKeydown = (e) => {
    if (e.keyCode === 13 && e.metaKey) {
      handleSubmit();
    }
  };

  const handleTextAreaChange = (e) => {
    console.log("handleTextAreaChange");
    setPostContent(e.target.value);
  };

  return (
    <div>
      <textarea
        required
        className="form-control"
        autoFocus
        value={postContent}
        onKeyDown={handleTexareaKeydown}
        onChange={handleTextAreaChange}
      />
      <div className="d-flex justify-content-end">
        <button
          type="submit"
          className="btn mt-2"
          onClick={handleSubmit}
          disabled={!postContent.length}
        >
          Post
        </button>
      </div>
      {posts.length &&
        posts
          .filter((_item, idx) => idx < MAX_LENGTH)
          .map(({ time, content }, idx) => (
            <div key={idx} className="mt-3 border-bottom pb-3">
              <small className="text-muted">
                <Moment fromNow>{time}</Moment>
              </small>
              <div>{content}</div>
            </div>
          ))}
    </div>
  );
}
