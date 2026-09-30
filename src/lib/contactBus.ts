import type { ContactTopic } from "./validation";

export const CONTACT_TOPIC_EVENT = "tx:contact-topic";

/** Scrolls to the contact form and preselects a topic, from anywhere on the page. */
export function openContact(topic: ContactTopic) {
  window.dispatchEvent(new CustomEvent<ContactTopic>(CONTACT_TOPIC_EVENT, { detail: topic }));
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
}
