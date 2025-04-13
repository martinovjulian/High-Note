import re
from typing import List
from difflib import SequenceMatcher
from rake_nltk import Rake
from nltk.corpus import stopwords
from sentence_transformers import SentenceTransformer, util
import nltk

# Download required resources if not present
nltk.download('stopwords')
nltk.download('punkt_tab')  # This downloads the missing tokenizer data

model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

def calculate_dynamic_threshold(text_length: int, class_size: int = 1) -> float:
    """
    Calculate dynamic threshold based on text length and class size.
    Returns a value between 0.65 and 0.85
    """
    base_threshold = 0.75
    length_factor = min(1.2, max(0.8, text_length / 1000))
    class_factor = min(1.1, max(0.9, class_size / 10))
    return min(0.85, max(0.65, base_threshold * length_factor * class_factor))

def normalize_phrase(text: str) -> str:
    return re.sub(r'[\W_]+', ' ', text.lower()).strip()

def is_similar(phrase_a: str, phrase_b: str, threshold: float = 0.75, method: str = 'string') -> bool:
    if method == 'string':
        return SequenceMatcher(None, normalize_phrase(phrase_a), normalize_phrase(phrase_b)).ratio() >= threshold
    elif method == 'semantic':
        emb_a = model.encode(phrase_a, convert_to_tensor=True)
        emb_b = model.encode(phrase_b, convert_to_tensor=True)
        return util.pytorch_cos_sim(emb_a, emb_b).item() >= threshold
    else:
        raise ValueError("Unsupported similarity method")

def filter_similar_phrases(phrases: List[str], threshold: float = 0.75, method: str = 'string') -> List[str]:
    filtered = []
    for phrase in phrases:
        if not any(is_similar(phrase, f, threshold, method) for f in filtered):
            filtered.append(phrase)
    return filtered

def extract_key_concepts(text: str, num_concepts: int = 5, threshold: float = 0.75, similarity_method: str = 'string', class_size: int = 1) -> List[str]:
    # Calculate dynamic threshold based on text length and class size
    dynamic_threshold = calculate_dynamic_threshold(len(text), class_size)
    effective_threshold = min(threshold, dynamic_threshold)  # Use the more conservative threshold
    
    # Initialize RAKE with English stopwords from NLTK
    rake = Rake(stopwords=stopwords.words('english'))
    rake.extract_keywords_from_text(text)
    ranked = rake.get_ranked_phrases()
    unique = filter_similar_phrases(ranked, effective_threshold, similarity_method)
    return unique[:num_concepts]
