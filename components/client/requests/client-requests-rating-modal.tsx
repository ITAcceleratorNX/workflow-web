"use client";

import { RatingModal } from "@/components/RatingModal";
import type { SubRequest } from "@/stores/useRequestStore";

interface ClientRequestsRatingModalProps {
  isOpen: boolean;
  requestToRate: SubRequest | null;
  ratingValue: number;
  onRatingChange: (value: number) => void;
  ratingComment: string;
  onCommentChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  userRatings: Record<number, { rating: number; comment?: string }>;
}

export function ClientRequestsRatingModal({
  isOpen,
  requestToRate,
  ratingValue,
  onRatingChange,
  ratingComment,
  onCommentChange,
  onClose,
  onSubmit,
  userRatings,
}: ClientRequestsRatingModalProps) {
  return (
    <RatingModal
      isOpen={isOpen && !!requestToRate}
      onClose={onClose}
      ratingValue={ratingValue}
      onRatingChange={onRatingChange}
      onSubmit={onSubmit}
      currentRating={requestToRate ? userRatings[requestToRate.id]?.rating : undefined}
      comment={ratingComment}
      onCommentChange={onCommentChange}
    />
  );
}
