'use client';
import { useEffect } from 'react';
import { AreaType } from '../types';
import { storage } from '../storage';

// Custom hook for persisting and loading quiz preferences
export function useQuizPersistence(
  selectedArea: AreaType | null,
  current: number | null,
  shuffleQuestions: boolean,
  setShuffleQuestions: (value: boolean) => void,
  shuffleAnswers: boolean,
  setShuffleAnswers: (value: boolean) => void,
  status: Record<number, 'correct' | 'fail' | 'pending'>,
  questionsLength: number
) {
  // Persist current question index per area
  useEffect(() => {
    if (selectedArea && current !== null) {
      const areaKey = selectedArea.shortName;
      storage.setAreaCurrentQuestion(areaKey, Number(current));
    }
  }, [selectedArea, current]);

  // Persist question order preference per area
  useEffect(() => {
    if (selectedArea && shuffleQuestions !== undefined) {
      const areaKey = selectedArea.shortName;
      storage.setAreaShuffleQuestions(areaKey, shuffleQuestions);
    }
  }, [shuffleQuestions]); // Only run when shuffleQuestions changes, not when selectedArea changes

  // Load question order preference when area changes
  useEffect(() => {
    if (selectedArea) {
      const areaKey = selectedArea.shortName;
      const saved = storage.getAreaShuffleQuestions(areaKey);
      if (saved !== undefined) {
        setShuffleQuestions(saved);
      } else {
        // Default to true (random/shuffled) for new areas
        setShuffleQuestions(true);
      }
    }
  }, [selectedArea, setShuffleQuestions]);

  // Persist answer order preference per area
  useEffect(() => {
    if (selectedArea && shuffleAnswers !== undefined) {
      const areaKey = selectedArea.shortName;
      storage.setAreaShuffleAnswers(areaKey, shuffleAnswers);
    }
  }, [shuffleAnswers]); // Only run when shuffleAnswers changes, not when selectedArea changes

  // Load answer order preference when area changes
  useEffect(() => {
    if (selectedArea) {
      const areaKey = selectedArea.shortName;
      const saved = storage.getAreaShuffleAnswers(areaKey);
      if (saved !== undefined) {
        setShuffleAnswers(saved);
      } else {
        // Default to false (no shuffle) for new areas
        setShuffleAnswers(false);
      }
    }
  }, [selectedArea, setShuffleAnswers]);

  // Persist status to localStorage whenever it changes
  useEffect(() => {
    if (questionsLength > 0 && selectedArea) {
      const areaKey = selectedArea.shortName;
      // Only persist if the status corresponds to the current area's questions
      // Check by comparing status keys with questions length
      const statusKeys = Object.keys(status).map(Number);
      const expectedLength = questionsLength;
      const statusMatchesCurrentArea = statusKeys.length === expectedLength;

      if (statusMatchesCurrentArea) {
        storage.setAreaQuizStatus(areaKey, status);
      }
    }
  }, [status, questionsLength, selectedArea]);
}
