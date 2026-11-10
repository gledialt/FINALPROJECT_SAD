import { describe, expect, it } from "vitest";
import { canAddInternalNote, canReplyFeedback, canSendFeedback, canViewAllFeedback, feedbackSchema } from "./feedback";

describe("feedback rules", () => {
  it("only residents send feedback", () => {
    expect(canSendFeedback("masyarakat")).toBe(true);
    expect(canSendFeedback("petugas")).toBe(false);
  });
  it("only admin replies officially", () => {
    expect(canReplyFeedback("admin")).toBe(true);
    expect(canReplyFeedback("petugas")).toBe(false);
  });
  it("officers see all feedback and add notes, residents do not", () => {
    expect(canViewAllFeedback("petugas")).toBe(true);
    expect(canViewAllFeedback("masyarakat")).toBe(false);
    expect(canAddInternalNote("masyarakat")).toBe(false);
  });
  it("requires type, category, title and message", () => {
    expect(feedbackSchema.safeParse({ jenis_feedback: "saran", kategori: "jadwal", judul: "", isi_pesan: "x" }).success).toBe(false);
    expect(feedbackSchema.safeParse({ jenis_feedback: "saran", kategori: "jadwal", judul: "A", isi_pesan: "B" }).success).toBe(true);
  });
});
