import { useRef, useEffect } from "react";

const AutoResizeTextarea = ({ value }) => {
  const textareaRef = useRef(null);

  function copy(ev) {
    const copyText = ev.target;

    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            copyText.parentElement.classList.add('copied'); // Adding the 'copied' class on success
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }

        document.body.removeChild(textArea);
    }

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(copyText.value)
            .then(() => {
                copyText.parentElement.classList.add('copied');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                fallbackCopyTextToClipboard(copyText.value);
            });
    } else {
        // Directly using the fallback if Clipboard API is not available
        fallbackCopyTextToClipboard(copyText.value);
    }
  }

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height to shrink if content is removed
      textarea.style.height = `${textarea.scrollHeight}px`; // Set height based on scroll height
    }
  }, [value]);

  function mouseLeaveHandler(ev) {
    ev.target.parentElement.classList.remove('copied');
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      rows="1" // Start with a single line
      onMouseOut={mouseLeaveHandler}
      onClick={copy}
      readOnly
    />
  );
};

export default AutoResizeTextarea;
