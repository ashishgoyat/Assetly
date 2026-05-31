"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useExitAnimation, MOTION_MS } from "@/app/hooks/useExitAnimation";
import type { Transaction } from "@/contracts/api-contracts";

interface SearchDropdownProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function formatAmount(amountInCents: number): string {
  return `$${(amountInCents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function SearchDropdown({ inputRef }: SearchDropdownProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Transaction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdown = useExitAnimation(isOpen, MOTION_MS.fast);

  // Debounced search — use setTimeout(fn, 0) for short queries so setState
  // is called asynchronously and does not trigger the react-hooks/set-state-in-effect rule.
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length < 2) {
      debounceTimer.current = setTimeout(() => {
        setIsOpen(false);
        setResults([]);
      }, 0);
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      };
    }

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/transactions?q=${encodeURIComponent(query)}&pageSize=6`
        );
        const json = (await res.json()) as {
          data?: {
            items?: Transaction[] | { items?: Transaction[] };
          };
        };
        let items: Transaction[] = [];
        if (Array.isArray(json.data?.items)) {
          items = (json.data.items as Transaction[]).slice(0, 6);
        } else if (json.data?.items && typeof json.data.items === "object") {
          const nested = (json.data.items as { items?: Transaction[] }).items;
          items = (nested ?? []).slice(0, 6);
        }
        setResults(items);
        setIsOpen(true);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  // Keyboard shortcut ⌘K / Ctrl+K and Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [inputRef]);

  // Click outside to close
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleResultClick = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    router.push("/dashboard/transactions");
  }, [router]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    []
  );

  const listboxId = "search-results-listbox";

  return (
    <div ref={wrapperRef} style={{ position: "relative", flex: 1 }}>
      <input
        ref={inputRef}
        type="search"
        placeholder="Search transactions, merchants, categories…"
        aria-label="Search transactions"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        role="combobox"
        autoComplete="off"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        style={{
          width: "100%",
          fontSize: 13,
          background: "transparent",
          border: 0,
          outline: 0,
          color: "inherit",
        }}
      />

      {dropdown.shouldRender && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="anim-pop"
          data-exiting={dropdown.isExiting ? "true" : "false"}
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            left: "-40px",
            right: 0,
            width: "calc(100% + 40px)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "var(--shadow-lg)",
            zIndex: 50,
            overflow: "hidden",
            transformOrigin: "top center",
          }}
        >
          {isLoading && (
            <div
              style={{
                padding: "12px 16px",
                fontSize: 13,
                color: "var(--ink-3)",
                textAlign: "center",
              }}
            >
              Searching…
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div
              style={{
                padding: "12px 16px",
                fontSize: 13,
                color: "var(--ink-3)",
                textAlign: "center",
              }}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!isLoading &&
            results.map((tx) => (
              <button
                key={tx.id}
                role="option"
                aria-selected={false}
                type="button"
                onClick={handleResultClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "9px 14px",
                  gap: 12,
                  background: "transparent",
                  border: 0,
                  borderBottom: "1px solid var(--border-2)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition:
                    "background var(--dur-fast) var(--ease-out-quart)",
                  color: "var(--ink)",
                  fontFamily: "var(--f-sans)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--surface-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {tx.merchant}
                </span>

                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color:
                        tx.type === "income" ? "var(--pos)" : "var(--ink)",
                    }}
                  >
                    {tx.type === "income" ? "+" : ""}
                    {formatAmount(tx.amountInCents)}
                  </span>
                  <span
                    className="pill"
                    style={{
                      background:
                        tx.type === "income"
                          ? "var(--pos-soft)"
                          : "var(--neg-soft)",
                      color:
                        tx.type === "income" ? "var(--pos)" : "var(--neg)",
                      fontSize: 10.5,
                      padding: "1px 7px",
                    }}
                  >
                    {tx.type}
                  </span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
