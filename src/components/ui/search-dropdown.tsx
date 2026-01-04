import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, ClipboardList, Loader2, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { useTranslation } from "@/lib/utils/translationLoader";

// Control API response types
interface ControlSearchTraining {
  id: number;
  uuid: string;
  image: string | null;
  title: string;
  description_short: string;
  sort: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

interface ControlQuestionGroup {
  id: number;
  title: string;
  active_questions_count: number;
  trainings_count: number;
  companies_count: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

interface ControlSearchResponse {
  data: {
    trainings: Array<ControlSearchTraining>;
    question_groups: Array<ControlQuestionGroup>;
  };
}

export function SearchDropdown() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  const { data, isLoading } = useQuery<ControlSearchResponse>({
    queryKey: ["dashboard-search", debouncedQuery],
    queryFn: async () => {
      const response = await controlPrivateApi.get("/dashboard/search", {
        params: {
          search: debouncedQuery,
          limit: 10,
        },
      });
      return response.data;
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 1000 * 60, // 1 minute
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(value.length >= 3);
    setSelectedIndex(-1);
  };

  // Get all results as flat array for keyboard navigation
  const trainings = data?.data.trainings || [];
  const questionGroups = data?.data.question_groups || [];

  const allResults = [
    ...trainings.map((item) => ({
      type: "training" as const,
      data: item,
    })),
    ...questionGroups.map((item) => ({
      type: "quiz" as const,
      data: item,
    })),
  ];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || !hasResults) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allResults.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allResults.length) {
          const selected = allResults[selectedIndex];
          if (selected.type === "training") {
            handleTrainingClick(selected.data);
          } else {
            handleQuizClick(selected.data);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleTrainingClick = (training: ControlSearchTraining) => {
    navigate({ to: `/trainings/${training.id}` });
    setIsOpen(false);
    setSearchQuery("");
    setSelectedIndex(-1);
  };

  const handleQuizClick = (quiz: ControlQuestionGroup) => {
    navigate({ to: `/quizzes/${quiz.id}/questions` });
    setIsOpen(false);
    setSearchQuery("");
    setSelectedIndex(-1);
  };

  const hasResults = trainings.length > 0 || questionGroups.length > 0;
  const showDropdown = isOpen && debouncedQuery.length >= 3;

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("search_input_placeholder")}
          className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          autoComplete="off"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-input rounded-lg shadow-lg max-h-[500px] overflow-y-auto z-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                {t("searching") || "Searching..."}
              </span>
            </div>
          ) : hasResults ? (
            <div className="py-2">
              {/* Trainings Section */}
              {trainings.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                    <BookOpen className="h-4 w-4" />
                    {t("trainings") || "Trainings"}
                  </div>
                  {trainings.map((training, index) => (
                    <button
                      key={training.id}
                      onClick={() => handleTrainingClick(training)}
                      className={cn(
                        "w-full px-4 py-3 hover:bg-accent transition-colors text-left flex items-start gap-3",
                        selectedIndex === index && "bg-accent",
                      )}
                    >
                      {training.image && (
                        <img
                          src={training.image}
                          alt={training.title}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground mb-1 truncate">
                          {training.title}
                        </div>
                        {training.description_short && (
                          <div className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {training.description_short}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {t("created_by") || "Created by"}{" "}
                            {training.created_user}
                          </span>
                          {training.is_active && (
                            <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              {t("active") || "Active"}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Question Groups Section */}
              {questionGroups.length > 0 && (
                <div>
                  <div className="px-4 py-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                    <ClipboardList className="h-4 w-4" />
                    {t("quizzes") || "Quizzes"}
                  </div>
                  {questionGroups.map((quiz, index) => {
                    const globalIndex = trainings.length + index;
                    return (
                      <button
                        key={quiz.id}
                        onClick={() => handleQuizClick(quiz)}
                        className={cn(
                          "w-full px-4 py-3 hover:bg-accent transition-colors text-left",
                          selectedIndex === globalIndex && "bg-accent",
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm text-foreground">
                            {quiz.title}
                          </div>
                          {quiz.is_active && (
                            <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              {t("active") || "Active"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {quiz.active_questions_count > 0 && (
                            <span>
                              {quiz.active_questions_count}{" "}
                              {t("questions") || "questions"}
                            </span>
                          )}
                          {quiz.trainings_count > 0 && (
                            <span>
                              {quiz.trainings_count}{" "}
                              {t("trainings") || "trainings"}
                            </span>
                          )}
                          {quiz.companies_count > 0 && (
                            <span>
                              {quiz.companies_count}{" "}
                              {t("companies") || "companies"}
                            </span>
                          )}
                          <span>
                            {t("created_by") || "Created by"}{" "}
                            {quiz.created_user}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="text-muted-foreground text-sm">
                {t("no_results_found") || "No results found"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t("try_different_search") || "Try a different search term"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

