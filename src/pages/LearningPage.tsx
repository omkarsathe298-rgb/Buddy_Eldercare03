import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  MessageCircle,
  CreditCard,
  ShieldCheck,
  Award,
  ChevronRight,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { AudioSpeakButton } from '../components/AudioSpeakButton';
import { api } from '../services/api';
import { Lesson } from '../types';

export const LearningPage: React.FC = () => {
  const { language } = usePreferences();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const res = await api.getLessons();
      setLessons(res.lessons || []);
    } catch (err) {
      console.warn('Failed to load lessons:', err);
    }
  };

  const handleOpenLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCurrentStepIndex(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setIsCompleted(Boolean(lesson.completed));
  };

  const handleBackToList = () => {
    setSelectedLesson(null);
    loadLessons();
  };

  const handleSelectQuizOption = (qIdx: number, optIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedLesson) return;
    setQuizSubmitted(true);

    let score = 0;
    selectedLesson.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });

    const totalQuestions = selectedLesson.quiz.length;
    const passed = score >= Math.ceil(totalQuestions / 2);

    try {
      await api.saveProgress(selectedLesson.id, true, score);
      setIsCompleted(true);
    } catch (err) {
      console.warn('Failed to record lesson progress:', err);
    }
  };

  const getLessonIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone':
        return Smartphone;
      case 'MessageCircle':
        return MessageCircle;
      case 'CreditCard':
        return CreditCard;
      case 'ShieldCheck':
        return ShieldCheck;
      default:
        return BookOpen;
    }
  };

  // If a specific lesson is active
  if (selectedLesson) {
    const IconComponent = getLessonIcon(selectedLesson.icon);
    const title = language === 'hi' ? selectedLesson.titleHi : language === 'mr' ? selectedLesson.titleMr : selectedLesson.title;
    const summary = language === 'hi' ? selectedLesson.summaryHi : language === 'mr' ? selectedLesson.summaryMr : selectedLesson.summary;
    const steps = selectedLesson.steps;
    const isQuizPhase = currentStepIndex >= steps.length;

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <button
          onClick={handleBackToList}
          className="inline-flex items-center gap-2 text-stone-700 hover:text-emerald-700 font-bold text-lg cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to All Lessons</span>
        </button>

        {/* Lesson Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {selectedLesson.category}
            </span>
            <AudioSpeakButton text={`${title}. ${summary}`} />
          </div>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <IconComponent className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                {title}
              </h1>
              <p className="text-lg text-stone-600 mt-1">
                {summary}
              </p>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="pt-2 flex items-center gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-3 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'bg-emerald-600'
                    : idx < currentStepIndex
                    ? 'bg-emerald-300'
                    : 'bg-stone-200'
                }`}
              />
            ))}
            <div
              className={`flex-1 h-3 rounded-full transition-all ${
                isQuizPhase ? 'bg-amber-500' : 'bg-stone-200'
              }`}
            />
          </div>
        </div>

        {/* Lesson Step or Quiz Display */}
        {!isQuizPhase ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <span className="text-emerald-700 font-extrabold text-lg">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <AudioSpeakButton
                text={`${steps[currentStepIndex].title}. ${steps[currentStepIndex].description}. Tip: ${steps[currentStepIndex].tip || ''}`}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
                {steps[currentStepIndex].title}
              </h2>
              <p className="text-xl text-stone-700 leading-relaxed">
                {steps[currentStepIndex].description}
              </p>

              {steps[currentStepIndex].tip && (
                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl text-amber-950 font-medium text-lg flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <strong>Helpful Senior Tip: </strong>
                    {steps[currentStepIndex].tip}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-stone-200">
              <button
                disabled={currentStepIndex === 0}
                onClick={() => setCurrentStepIndex(prev => prev - 1)}
                className={`px-5 py-3 rounded-xl font-bold text-lg cursor-pointer ${
                  currentStepIndex === 0
                    ? 'opacity-40 text-stone-400 cursor-not-allowed'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                }`}
              >
                Previous Step
              </button>

              <button
                onClick={() => setCurrentStepIndex(prev => prev + 1)}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow transition-transform hover:scale-102 flex items-center gap-2 cursor-pointer"
              >
                <span>{currentStepIndex === steps.length - 1 ? 'Go to Practice Quiz' : 'Next Step'}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Practice Quiz Section */
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xl">
                <HelpCircle className="w-6 h-6 text-amber-600" />
                <span>Practice Check: Knowledge Quiz</span>
              </div>
            </div>

            <div className="space-y-8">
              {selectedLesson.quiz.map((q, qIdx) => {
                const userChoice = quizAnswers[qIdx];
                const isAnswered = userChoice !== undefined;
                const isCorrect = userChoice === q.correctIndex;

                return (
                  <div key={qIdx} className="space-y-4 p-5 bg-stone-50 rounded-2xl border border-stone-200">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold text-stone-900">
                        {qIdx + 1}. {q.question}
                      </h3>
                      <AudioSpeakButton text={q.question} size="sm" />
                    </div>

                    <div className="space-y-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userChoice === optIdx;
                        let optionStyle = 'border-stone-300 bg-white text-stone-800 hover:border-emerald-500';

                        if (quizSubmitted) {
                          if (optIdx === q.correctIndex) {
                            optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                          } else if (isSelected) {
                            optionStyle = 'border-rose-500 bg-rose-50 text-rose-950 font-medium';
                          }
                        } else if (isSelected) {
                          optionStyle = 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectQuizOption(qIdx, optIdx)}
                            className={`w-full p-4 text-left text-lg rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && optIdx === q.correctIndex && (
                              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div
                        className={`p-4 rounded-xl text-base ${
                          isCorrect ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        <div className="font-bold mb-1">
                          {isCorrect ? '✓ Correct Answer!' : '✗ Not quite right:'}
                        </div>
                        <div>{q.explanation}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quiz Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-200">
              <button
                onClick={() => setCurrentStepIndex(steps.length - 1)}
                className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-lg cursor-pointer"
              >
                Review Steps
              </button>

              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizAnswers).length < selectedLesson.quiz.length}
                  className={`px-8 py-4 rounded-2xl font-bold text-xl shadow cursor-pointer ${
                    Object.keys(quizAnswers).length >= selectedLesson.quiz.length
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  Submit Quiz & Complete Lesson
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setQuizSubmitted(false);
                      setQuizAnswers({});
                    }}
                    className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-lg flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Try Quiz Again</span>
                  </button>

                  <button
                    onClick={handleBackToList}
                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl rounded-2xl shadow cursor-pointer flex items-center gap-2"
                  >
                    <Award className="w-6 h-6" />
                    <span>Lesson Completed! Continue</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // All Lessons View
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-white/10 rounded-2xl text-emerald-300">
              <BookOpen className="w-8 h-8" />
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Digital Learning for Seniors
            </h1>
          </div>
          <p className="text-xl text-emerald-100 leading-relaxed">
            Short, patient, step-by-step guides with practice quizzes. Master your smartphone and avoid digital pitfalls at your own pace.
          </p>
        </div>
      </div>

      {/* Lesson Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lessons.map(lesson => {
          const IconComponent = getLessonIcon(lesson.icon);
          const title = language === 'hi' ? lesson.titleHi : language === 'mr' ? lesson.titleMr : lesson.title;
          const summary = language === 'hi' ? lesson.summaryHi : language === 'mr' ? lesson.summaryMr : lesson.summary;

          return (
            <div
              key={lesson.id}
              onClick={() => handleOpenLesson(lesson)}
              className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-stone-200 hover:border-emerald-500 shadow-sm transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  {lesson.completed ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-sm border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                      {lesson.steps.length} Steps
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                    {title}
                  </h3>
                  <p className="text-lg text-stone-600 mt-2 leading-snug">
                    {summary}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-emerald-700 font-bold text-lg">
                <span>{lesson.completed ? 'Review Lesson & Quiz' : 'Start Learning'}</span>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
