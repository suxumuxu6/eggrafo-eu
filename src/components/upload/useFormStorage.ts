
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'upload_form_data';

interface FormData {
  title: string;
  description: string;
  tags: string;
  category: string;
}

export const useFormStorage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState<string>('');

  // Load form data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setTitle(parsed.title || '');
        setDescription(parsed.description || '');
        setTags(parsed.tags || '');
        setCategory(parsed.category || '');
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const formData = {
      title,
      description,
      tags,
      category
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [title, description, tags, category]);

  const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTags('');
    setCategory('');
    clearStorage();
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    tags,
    setTags,
    category,
    setCategory,
    clearStorage,
    resetForm
  };
};
