import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { api } from "@/shared/lib/http";
import type { QuizDTO } from "@/features/quizzes/types";

interface ExploreResponse {
  quizzes: QuizDTO[];
  page: number;
}

function fetchExplore(q: string, page: number): Promise<ExploreResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (q) params.set("q", q);
  return api.get(`explore?${params}`).json<ExploreResponse>();
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["explore", query, page],
    queryFn: () => fetchExplore(query, page),
  });

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0C0C1F", color: "#E5E3FF" }}
    >
      {/* Ambient glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 640,
            height: 640,
            top: -128,
            left: -128,
            background: "rgba(166,140,255,0.08)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 400,
            height: 400,
            bottom: -80,
            right: -80,
            background: "rgba(141,205,255,0.07)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1
            className="font-display text-4xl font-bold mb-2"
            style={{ color: "#E5E3FF", letterSpacing: "-1px" }}
          >
            Explore
          </h1>
          <p style={{ color: "#A8A7D5" }}>
            Discover public quizzes created by the community.
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-8">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search quizzes…"
            className="w-full rounded-full px-5 py-3 text-sm outline-none"
            style={{
              background: "#0F1127",
              border: "1px solid rgba(68,68,108,0.30)",
              color: "#E5E3FF",
            }}
          />
        </div>

        {/* Quiz grid */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div
              className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#7C4DFF", borderTopColor: "transparent" }}
            />
          </div>
        )}

        {isError && (
          <p className="text-center py-20" style={{ color: "#EF4444" }}>
            Failed to load quizzes.
          </p>
        )}

        {data && data.quizzes.length === 0 && (
          <p className="text-center py-20" style={{ color: "#8B8FB8" }}>
            No quizzes found{query ? ` for "${query}"` : ""}.
          </p>
        )}

        {data && data.quizzes.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.quizzes.map((quiz) => (
                <ExploreCard key={quiz.id} quiz={quiz} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-full px-5 py-2 text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  border: "1px solid rgba(68,68,108,0.30)",
                  color: "#A8A7D5",
                }}
              >
                ← Prev
              </button>
              <span className="text-sm" style={{ color: "#8B8FB8" }}>
                Page {page}
              </span>
              <button
                disabled={data.quizzes.length < 20}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full px-5 py-2 text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  border: "1px solid rgba(68,68,108,0.30)",
                  color: "#A8A7D5",
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ExploreCard({ quiz }: { quiz: QuizDTO }) {
  return (
    <div
      className="rounded-xl flex flex-col overflow-hidden"
      style={{
        background: "#111128",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Cover image or placeholder */}
      <div
        className="h-36 w-full flex items-center justify-center"
        style={{
          background: quiz.cover_url
            ? undefined
            : "linear-gradient(135deg, #1C1C3D 0%, #111128 100%)",
          backgroundImage: quiz.cover_url ? `url(${quiz.cover_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!quiz.cover_url && (
          <span className="text-4xl select-none">🌌</span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3
          className="font-display font-semibold text-base leading-tight line-clamp-2"
          style={{ color: "#E5E3FF" }}
        >
          {quiz.title}
        </h3>
        {quiz.description && (
          <p
            className="text-xs line-clamp-2"
            style={{ color: "#8B8FB8" }}
          >
            {quiz.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs" style={{ color: "#A8A7D5" }}>
            ▶ {quiz.plays_count.toLocaleString()} plays
          </span>
          <Link
            to={`/join?quiz=${quiz.id}`}
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(124,77,255,0.25)",
            }}
          >
            Play
          </Link>
        </div>
      </div>
    </div>
  );
}
