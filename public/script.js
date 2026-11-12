const initialView = document.getElementById("initialView");
const openFormButton = document.getElementById("openFormButton");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const submitButton = document.getElementById("submitButton");
const messageCount = document.getElementById("messageCount");
const characterCount = document.getElementById("characterCount");
const successDialog = document.getElementById("successDialog");
const closeDialogButton = document.getElementById("closeDialogButton");

async function updateMessageCount() {
  try {
    const response = await fetch("/api/messages/count");
    if (!response.ok) throw new Error("Count request failed");
    const data = await response.json();
    messageCount.textContent =
      `${data.count} ${data.count === 1 ? "message" : "messages"} left`;
  } catch (error) {
    messageCount.textContent = "Message count is temporarily unavailable.";
  }
}

openFormButton.addEventListener("click", () => {
  initialView.hidden = true;
  messageForm.hidden = false;
  messageInput.focus();
});

messageInput.addEventListener("input", () => {
  characterCount.textContent = `${messageInput.value.length} / 2000`;
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();

  if (!message) {
    messageInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Submission failed.");

    messageForm.hidden = true;
    initialView.hidden = false;
    messageForm.reset();
    characterCount.textContent = "0 / 2000";
    await updateMessageCount();
    successDialog.hidden = false;
    closeDialogButton.focus();
  } catch (error) {
    alert(error.message || "Something went wrong. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit";
  }
});

closeDialogButton.addEventListener("click", () => {
  successDialog.hidden = true;
  openFormButton.focus();
});

successDialog.addEventListener("click", (event) => {
  if (event.target === successDialog) {
    successDialog.hidden = true;
    openFormButton.focus();
  }
});

updateMessageCount();