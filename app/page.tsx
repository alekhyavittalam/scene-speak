"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check, ChevronRight, CircleHelp,
  Clapperboard, Image as ImageIcon, Languages, Library, MessageCircle, RotateCcw,
  Sparkles, ThumbsDown, ThumbsUp, Trash2, Upload, Volume2, X
} from "lucide-react";
import { track } from "@/lib/analytics";
import { sampleLessons, samplePhrase } from "@/lib/fixtures";
import { lessonSchema, type Language, type Lesson, type QuizAttempt, type SavedLesson } from "@/lib/schemas";
import { readSavedLessons, saveAttempt, scoreQuiz, toggleSaved, updateFeedback, writeSavedLessons } from "@/lib/storage";

type View = "learn" | "lesson" | "saved" | "quiz";
type InputMode = "text" | "image";

const languageMeta: Record<Language, { label: string; native: string; flag: string; placeholder: string }> = {
  hindi: { label: "Hindi", native: "हिन्दी", flag: "हि", placeholder: "Type a Hindi phrase you heard…" },
  french: { label: "French", native: "Français", flag: "Fr", placeholder: "Type a French phrase you heard…" },
};

async function responseError(response: Response) {
  const body = await response.json().catch(() => null);
  return body?.error || "Something went wrong. Please try again.";
}

export default function Home() {
  const [view, setView] = useState<View>("learn");
  const [language, setLanguage] = useState<Language>("hindi");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [phrase, setPhrase] = useState("");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [saved, setSaved] = useState<SavedLesson[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageName, setImageName] = useState("");
  const [extracted, setExtracted] = useState(false);
  const [warning, setWarning] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSaved(readSavedLessons());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeSavedLessons(saved);
  }, [saved, hydrated]);

  const isSaved = lesson ? saved.some((item) => item.lesson.id === lesson.id) : false;
  const lessonFeedback = lesson ? saved.find((item) => item.lesson.id === lesson.id)?.feedback : null;

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeLanguage(next: Language) {
    setLanguage(next);
    setPhrase("");
    setImageName("");
    setExtracted(false);
    setWarning("");
    setError("");
  }

  function resetInput() {
    setPhrase("");
    setImageName("");
    setExtracted(false);
    setWarning("");
    setError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  function openSample(chosen: Language = language) {
    setLanguage(chosen);
    setLesson(sampleLessons[chosen]);
    setPhrase(samplePhrase[chosen]);
    track("input_started", { language: chosen, inputType: "sample" });
    track("lesson_completed", { language: chosen, inputType: "sample", lessonId: sampleLessons[chosen].id });
    navigate("lesson");
  }

  async function generateLesson() {
    const trimmed = phrase.trim();
    if (!trimmed) return setError("Enter a phrase first.");
    if (trimmed.length > 200) return setError("Keep the phrase under 200 characters.");
    setLoading(true);
    setError("");
    track("input_started", { language, inputType: inputMode });
    try {
      const response = await fetch("/api/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, phrase: trimmed }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const result = lessonSchema.parse(await response.json());
      setLesson(result);
      track("lesson_completed", { language, inputType: inputMode, lessonId: result.id });
      navigate("lesson");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't create that lesson.");
    } finally {
      setLoading(false);
    }
  }

  async function processImage(file: File) {
    setError("");
    setWarning("");
    setExtracted(false);
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) return setError("Use a JPG, PNG, or WebP screenshot.");
    if (file.size > 5 * 1024 * 1024) return setError("Keep screenshots under 5 MB.");
    setImageName(file.name);
    setLoading(true);
    track("input_started", { language, inputType: "image" });
    try {
      const form = new FormData();
      form.append("language", language);
      form.append("image", file);
      const response = await fetch("/api/extract", { method: "POST", body: form });
      if (!response.ok) throw new Error(await responseError(response));
      const result = await response.json();
      setPhrase(result.extractedText);
      setWarning(result.confidenceWarning || "");
      setExtracted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't read that screenshot.");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) processImage(file);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) processImage(file);
  }

  function handleSave(target = lesson) {
    if (!target) return;
    const wasSaved = saved.some((item) => item.lesson.id === target.id);
    setSaved((current) => toggleSaved(current, target));
    if (!wasSaved) track("phrase_saved", { language: target.language, lessonId: target.id });
  }

  function handleFeedback(feedback: "helpful" | "not_helpful") {
    if (!lesson) return;
    setSaved((current) => updateFeedback(current, lesson, feedback));
    track("lesson_feedback", { language: lesson.language, lessonId: lesson.id, feedback });
  }

  function recordAttempt(target: Lesson, answers: number[]) {
    const attempt: QuizAttempt = {
      lessonId: target.id,
      answers,
      score: scoreQuiz(target, answers),
      completedAt: new Date().toISOString(),
    };
    setSaved((current) => saveAttempt(current, target, attempt));
    track("quiz_completed", { language: target.language, lessonId: target.id, score: attempt.score });
  }

  return (
    <div className="app-shell">
      <Header view={view} savedCount={saved.length} onNavigate={navigate} />
      <main>
        {view === "learn" && (
          <LearnView
            language={language} inputMode={inputMode} phrase={phrase} loading={loading} error={error}
            imageName={imageName} extracted={extracted} warning={warning} fileInput={fileInput}
            onLanguage={changeLanguage} onMode={(mode) => { setInputMode(mode); resetInput(); }}
            onPhrase={setPhrase} onGenerate={generateLesson} onFile={onFileChange} onDrop={onDrop}
            onBrowse={() => fileInput.current?.click()} onReset={resetInput} onSample={openSample}
          />
        )}
        {view === "lesson" && lesson && (
          <LessonView lesson={lesson} isSaved={isSaved} feedback={lessonFeedback || null}
            onBack={() => navigate("learn")} onSave={() => handleSave()} onFeedback={handleFeedback}
            onReview={() => navigate("quiz")} />
        )}
        {view === "saved" && (
          <SavedView items={saved} onOpen={(target) => { setLesson(target); navigate("lesson"); }}
            onQuiz={(target) => { setLesson(target); navigate("quiz"); }}
            onRemove={handleSave} onClear={() => setSaved([])} onLearn={() => navigate("learn")} />
        )}
        {view === "quiz" && lesson && (
          <QuizView lesson={lesson} previous={saved.find((item) => item.lesson.id === lesson.id)?.latestAttempt || null}
            onBack={() => navigate("saved")} onComplete={recordAttempt} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function Header({ view, savedCount, onNavigate }: { view: View; savedCount: number; onNavigate: (view: View) => void }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => onNavigate("learn")} aria-label="SceneSpeak home">
        <span className="brand-mark"><Clapperboard size={21} strokeWidth={1.8} /></span>
        <span>Scene<span>Speak</span></span>
      </button>
      <nav aria-label="Primary navigation">
        <button className={view === "learn" || view === "lesson" ? "active" : ""} onClick={() => onNavigate("learn")}>Learn</button>
        <button className={view === "saved" || view === "quiz" ? "active" : ""} onClick={() => onNavigate("saved")}>
          Saved <span className="count-badge">{savedCount}</span>
        </button>
      </nav>
    </header>
  );
}

type LearnProps = {
  language: Language; inputMode: InputMode; phrase: string; loading: boolean; error: string;
  imageName: string; extracted: boolean; warning: string; fileInput: React.RefObject<HTMLInputElement>;
  onLanguage: (language: Language) => void; onMode: (mode: InputMode) => void; onPhrase: (phrase: string) => void;
  onGenerate: () => void; onFile: (event: ChangeEvent<HTMLInputElement>) => void; onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onBrowse: () => void; onReset: () => void; onSample: (language?: Language) => void;
};

function LearnView(props: LearnProps) {
  const { language, inputMode, phrase, loading, error, imageName, extracted, warning } = props;
  return (
    <div className="learn-view">
      <section className="hero wrap">
        <div className="eyebrow"><span /> Language that lives beyond the subtitles</div>
        <h1>Don&apos;t just translate it.<br /><em>Understand the scene.</em></h1>
        <p>Turn memorable movie lines into lessons on tone, culture, and how people actually speak.</p>
      </section>

      <section className="composer-card wrap" aria-labelledby="composer-title">
        <div className="composer-head">
          <div><span className="step">01</span><div><h2 id="composer-title">Choose your language</h2><p>What are you watching?</p></div></div>
          <div className="language-toggle" role="group" aria-label="Choose language">
            {(["hindi", "french"] as Language[]).map((item) => (
              <button key={item} className={language === item ? "selected" : ""} onClick={() => props.onLanguage(item)}>
                <span className="lang-mark">{languageMeta[item].flag}</span>
                <span><strong>{languageMeta[item].label}</strong><small>{languageMeta[item].native}</small></span>
                {language === item && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>

        <div className="rule" />
        <div className="input-section">
          <div className="input-title"><span className="step">02</span><div><h2>Add the line</h2><p>Type it in or pull it from a screenshot.</p></div></div>
          <div className="mode-tabs" role="tablist">
            <button role="tab" aria-selected={inputMode === "text"} className={inputMode === "text" ? "active" : ""} onClick={() => props.onMode("text")}><MessageCircle size={17} /> Type a phrase</button>
            <button role="tab" aria-selected={inputMode === "image"} className={inputMode === "image" ? "active" : ""} onClick={() => props.onMode("image")}><ImageIcon size={17} /> Upload screenshot</button>
          </div>

          {inputMode === "text" ? (
            <div className="phrase-box">
              <textarea value={phrase} maxLength={200} onChange={(event) => props.onPhrase(event.target.value)} placeholder={languageMeta[language].placeholder} aria-label="Movie phrase" />
              <span>{phrase.length} / 200</span>
            </div>
          ) : extracted ? (
            <div className="extracted-panel">
              <div className="extract-status"><span><Check size={15} /></span><div><strong>Subtitle found</strong><small>Check the text before creating your lesson.</small></div><button onClick={props.onReset} aria-label="Remove screenshot"><X size={18} /></button></div>
              <div className="phrase-box confirmed"><textarea value={phrase} maxLength={200} onChange={(event) => props.onPhrase(event.target.value)} aria-label="Extracted subtitle" /><span>{phrase.length} / 200</span></div>
              {warning && <p className="warning">{warning}</p>}
            </div>
          ) : (
            <div className={`drop-zone ${loading ? "loading" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={props.onDrop}>
              <input ref={props.fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={props.onFile} hidden />
              <span className="upload-icon">{loading ? <span className="spinner" /> : <Upload size={24} />}</span>
              <strong>{loading ? "Reading the subtitle…" : "Drop a subtitle screenshot here"}</strong>
              <p>{imageName || "JPG, PNG, or WebP · up to 5 MB"}</p>
              {!loading && <button onClick={props.onBrowse}>Choose an image</button>}
            </div>
          )}

          {error && <div className="error-banner" role="alert"><CircleHelp size={18} /><span>{error}</span><button onClick={() => props.onSample()}>Try a sample</button></div>}
          <div className="composer-actions">
            <button className="sample-link" onClick={() => props.onSample()}><Sparkles size={16} /> Try the {languageMeta[language].label} sample</button>
            <button className="primary-button" disabled={loading || !phrase.trim() || (inputMode === "image" && !extracted)} onClick={props.onGenerate}>
              {loading && inputMode === "text" ? <span className="spinner small" /> : <Sparkles size={18} />}
              {loading && inputMode === "text" ? "Building your lesson…" : "Explain this phrase"}<ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className="how-it-works wrap">
        <div><small>HOW IT WORKS</small><h2>From subtitle to <em>real understanding.</em></h2></div>
        <div className="steps-grid">
          <article><span><Clapperboard /></span><b>01</b><h3>Bring a line</h3><p>Type a phrase or upload the subtitle you just saw.</p></article>
          <article><span><Languages /></span><b>02</b><h3>See beyond translation</h3><p>Learn its tone, context, vocabulary, and cultural weight.</p></article>
          <article><span><Library /></span><b>03</b><h3>Make it stick</h3><p>Save the phrase and test yourself with a focused review.</p></article>
        </div>
      </section>
    </div>
  );
}

function LessonView({ lesson, isSaved, feedback, onBack, onSave, onFeedback, onReview }: {
  lesson: Lesson; isSaved: boolean; feedback: SavedLesson["feedback"]; onBack: () => void; onSave: () => void;
  onFeedback: (feedback: "helpful" | "not_helpful") => void; onReview: () => void;
}) {
  return (
    <div className="lesson-view wrap narrow">
      <button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Learn another phrase</button>
      <section className="lesson-hero">
        <div className="lesson-kicker"><span>{lesson.language === "hindi" ? "हि" : "Fr"}</span>{languageMeta[lesson.language].label} · Scene lesson</div>
        <blockquote>“{lesson.original}”</blockquote>
        <div className="pronunciation"><Volume2 size={17} /><span><small>{lesson.pronunciationLabel}</small>{lesson.pronunciation}</span></div>
        <button className={`save-button ${isSaved ? "saved" : ""}`} onClick={onSave}>{isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}{isSaved ? "Saved" : "Save phrase"}</button>
      </section>

      <section className="meaning-card">
        <small>NATURAL MEANING</small><h1>{lesson.naturalMeaning}</h1>
        <div className="literal"><span>Word for word</span><p>{lesson.literalTranslation}</p></div>
      </section>

      <section className="tone-section section-block">
        <div className="section-label"><span>01</span><div><small>READ THE ROOM</small><h2>How it lands</h2></div></div>
        <div className="tone-card">
          <div className="tone-tags">{lesson.toneLabels.map((tone) => <span key={tone}>{tone}</span>)}</div>
          <p>{lesson.toneExplanation}</p>
          <div className="usage-grid">
            <div className="use"><strong><Check size={17} /> When it works</strong><p>{lesson.whenToUse}</p></div>
            <div className="avoid"><strong><X size={17} /> Tread carefully</strong><p>{lesson.whenNotToUse}</p></div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-label"><span>02</span><div><small>BREAK IT DOWN</small><h2>Words worth keeping</h2></div></div>
        <div className="vocab-list">{lesson.vocabulary.map((item, index) => <div key={item.term}><b>{String(index + 1).padStart(2, "0")}</b><strong>{item.term}</strong><p>{item.meaning}</p></div>)}</div>
      </section>

      <section className="section-block">
        <div className="section-label"><span>03</span><div><small>SAY IT ANOTHER WAY</small><h2>A nearby expression</h2></div></div>
        <div className="similar-card"><Sparkles size={21} /><div><h3>{lesson.similarExpression.phrase}</h3><strong>{lesson.similarExpression.meaning}</strong><p>{lesson.similarExpression.distinction}</p></div></div>
      </section>

      <section className="lesson-cta">
        <div><small>READY TO TEST THE SCENE?</small><h2>Would you know when to use it?</h2><p>Three quick questions on meaning, tone, and context.</p></div>
        <button className="primary-button" onClick={onReview}>Start quick review <ArrowRight size={18} /></button>
      </section>
      <section className="feedback-row"><span>Was this explanation useful?</span><button className={feedback === "helpful" ? "selected" : ""} onClick={() => onFeedback("helpful")}><ThumbsUp size={16} /> Yes</button><button className={feedback === "not_helpful" ? "selected" : ""} onClick={() => onFeedback("not_helpful")}><ThumbsDown size={16} /> Not quite</button></section>
      <p className="ai-note"><Sparkles size={13} /> AI-generated guidance. Nuance can vary by speaker and scene.</p>
    </div>
  );
}

function SavedView({ items, onOpen, onQuiz, onRemove, onClear, onLearn }: {
  items: SavedLesson[]; onOpen: (lesson: Lesson) => void; onQuiz: (lesson: Lesson) => void; onRemove: (lesson: Lesson) => void; onClear: () => void; onLearn: () => void;
}) {
  return (
    <div className="saved-view wrap">
      <section className="saved-header"><div><div className="eyebrow"><span /> Your phrase collection</div><h1>Lines worth <em>remembering.</em></h1><p>Return to the moments that taught you how the language really feels.</p></div>{items.length > 0 && <button className="clear-button" onClick={onClear}><Trash2 size={16} /> Clear collection</button>}</section>
      {items.length === 0 ? (
        <section className="empty-state"><span><Bookmark size={28} /></span><h2>Your collection is waiting</h2><p>Save a phrase after exploring its tone and meaning. It&apos;ll show up here, ready to review.</p><button className="primary-button" onClick={onLearn}>Learn your first phrase <ArrowRight size={18} /></button></section>
      ) : (
        <section className="saved-grid">
          {items.map(({ lesson, latestAttempt }) => (
            <article className="saved-card" key={lesson.id}>
              <div className="saved-card-top"><span>{lesson.language === "hindi" ? "हि" : "Fr"} · {languageMeta[lesson.language].label}</span><button onClick={() => onRemove(lesson)} aria-label={`Remove ${lesson.original}`}><BookmarkCheck size={19} /></button></div>
              <button className="saved-card-body" onClick={() => onOpen(lesson)}><h2>“{lesson.original}”</h2><p>{lesson.naturalMeaning}</p><div>{lesson.toneLabels.slice(0, 2).map((tone) => <span key={tone}>{tone}</span>)}</div></button>
              <div className="saved-card-footer"><span>{latestAttempt ? `Last score ${latestAttempt.score}/3` : "Not reviewed yet"}</span><button onClick={() => onQuiz(lesson)}>{latestAttempt ? "Review again" : "Start review"}<ChevronRight size={16} /></button></div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function QuizView({ lesson, previous, onBack, onComplete }: { lesson: Lesson; previous: QuizAttempt | null; onBack: () => void; onComplete: (lesson: Lesson, answers: number[]) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const question = lesson.quiz[index];
  const score = finished ? scoreQuiz(lesson, answers) : 0;

  function choose(option: number) {
    if (selected !== null) return;
    setSelected(option);
    track("quiz_answered", { language: lesson.language, lessonId: lesson.id, correct: option === question.correctIndex });
  }

  function next() {
    if (selected === null) return;
    const nextAnswers = [...answers, selected];
    if (index === lesson.quiz.length - 1) {
      setAnswers(nextAnswers);
      setFinished(true);
      onComplete(lesson, nextAnswers);
    } else {
      setAnswers(nextAnswers);
      setIndex((current) => current + 1);
      setSelected(null);
    }
  }

  function restart() { setIndex(0); setAnswers([]); setSelected(null); setFinished(false); }

  if (finished) return (
    <div className="quiz-view wrap narrow">
      <button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to saved phrases</button>
      <section className="result-card"><span className="result-icon"><Sparkles size={28} /></span><small>REVIEW COMPLETE</small><h1>{score === 3 ? "You read the scene perfectly." : score === 2 ? "The meaning is sticking." : "One more watch-through."}</h1><div className="score-ring"><strong>{score}</strong><span>/ 3</span></div><p>{score === 3 ? "You understood the meaning, tone, and moment." : "Revisit the context, then give it another go."}</p><div className="result-actions"><button className="secondary-button" onClick={onBack}>Back to collection</button><button className="primary-button" onClick={restart}><RotateCcw size={17} /> Review again</button></div></section>
    </div>
  );

  return (
    <div className="quiz-view wrap narrow">
      <button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to saved phrases</button>
      <section className="quiz-card">
        <div className="quiz-progress"><span>QUESTION {index + 1} OF 3</span><div>{lesson.quiz.map((_, item) => <i key={item} className={item <= index ? "active" : ""} />)}</div></div>
        <div className="quiz-phrase">“{lesson.original}”</div>
        <small>{question.type === "meaning" ? "MEANING" : question.type === "tone" ? "TONE" : "IN THE WILD"}</small>
        <h1>{question.prompt}</h1>
        <div className="options">{question.options.map((option, optionIndex) => {
          const answered = selected !== null;
          const correct = answered && optionIndex === question.correctIndex;
          const wrong = answered && optionIndex === selected && !correct;
          return <button key={option} className={`${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`} onClick={() => choose(optionIndex)} disabled={answered}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}{correct && <Check size={18} />}{wrong && <X size={18} />}</button>;
        })}</div>
        {selected !== null && <div className={`answer-note ${selected === question.correctIndex ? "correct" : "wrong"}`}><strong>{selected === question.correctIndex ? "Exactly." : "Not quite."}</strong><p>{question.explanation}</p></div>}
        <div className="quiz-footer"><span>{previous && index === 0 ? `Previous best: ${previous.score}/3` : "Think about the scene, not just the words."}</span><button className="primary-button" disabled={selected === null} onClick={next}>{index === 2 ? "See my score" : "Next question"}<ArrowRight size={17} /></button></div>
      </section>
    </div>
  );
}

function Footer() {
  return <footer><div className="brand"><span className="brand-mark"><Clapperboard size={18} /></span><span>Scene<span>Speak</span></span></div><p>Learn the line. Read the room.</p><span>Hindi · French</span></footer>;
}
