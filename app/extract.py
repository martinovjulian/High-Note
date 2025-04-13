import re
from typing import List
from difflib import SequenceMatcher
from rake_nltk import Rake
from nltk.corpus import stopwords
from sentence_transformers import SentenceTransformer, util
import nltk

# Download required resources if not already present
nltk.download('stopwords')
nltk.download('punkt_tab')  # Downloads additional tokenizer data

# Initialize the sentence transformer model once (reuse across calls)
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')


def calculate_dynamic_threshold(text_length: int, class_size: int = 1) -> float:
    """
    Calculate a dynamic threshold based on text length and class size.
    Returns a value between 0.65 and 0.85.
    """
    base_threshold = 0.75
    # Adjust factors based on text length and class size
    length_factor = min(1.2, max(0.8, text_length / 1000))
    class_factor = min(1.1, max(0.9, class_size / 10))
    dynamic_value = base_threshold * length_factor * class_factor
    # Constrain the output threshold to be between 0.65 and 0.85
    return min(0.85, max(0.65, dynamic_value))


def normalize_phrase(text: str) -> str:
    """
    Normalize a phrase: lowercases the text and removes non-alphanumeric characters.
    """
    return re.sub(r'[\W_]+', ' ', text.lower()).strip()


def is_similar(phrase_a: str, phrase_b: str, threshold: float = 0.75, method: str = 'string') -> bool:
    """
    Check if two phrases are similar based on a threshold.
    If method == 'string', it uses SequenceMatcher.
    If method == 'semantic', it uses SentenceTransformer embeddings.
    """
    if method == 'string':
        return SequenceMatcher(None, normalize_phrase(phrase_a), normalize_phrase(phrase_b)).ratio() >= threshold
    elif method == 'semantic':
        emb_a = model.encode(phrase_a, convert_to_tensor=True)
        emb_b = model.encode(phrase_b, convert_to_tensor=True)
        # Use cosine similarity from sentence-transformers utility
        return util.pytorch_cos_sim(emb_a, emb_b).item() >= threshold
    else:
        raise ValueError("Unsupported similarity method")


def filter_similar_phrases(phrases: List[str], threshold: float = 0.75, method: str = 'string') -> List[str]:
    """
    Filter out phrases that are similar to each other.
    Only one phrase from a similar group is kept.
    """
    filtered = []
    for phrase in phrases:
        if not any(is_similar(phrase, existing, threshold, method) for existing in filtered):
            filtered.append(phrase)
    return filtered


def extract_key_concepts(
    text: str,
    num_concepts: int = 10,
    threshold: float = 0.75,
    similarity_method: str = 'string',
    class_size: int = 1
) -> List[str]:
    """
    Extract key concepts from the given text using the RAKE algorithm.
    
    Args:
        text: The text to extract concepts from.
        num_concepts: Maximum number of concepts to extract (default 10).
        threshold: Similarity threshold for filtering similar concepts (default 0.75).
        similarity_method: 'string' or 'semantic' for phrase comparison.
        class_size: Class size used to adjust the dynamic threshold.
        
    Returns:
        A list of extracted key concepts.
    """
    print(f"Extracting key concepts from text of length {len(text)}")
    print(f"Parameters: num_concepts={num_concepts}, threshold={threshold}, method={similarity_method}, class_size={class_size}")
    
    # If the text is too short for meaningful extraction, return empty list.
    if not text or len(text) < 50:
        print("Text too short for meaningful extraction")
        return []
    
    # Calculate a dynamic threshold based on text length and class size.
    dynamic_threshold = calculate_dynamic_threshold(len(text), class_size)
    effective_threshold = min(threshold, dynamic_threshold)
    print(f"Calculated dynamic threshold: {dynamic_threshold}, effective_threshold: {effective_threshold}")
    
    try:
        # Initialize RAKE with English stopwords from NLTK.
        rake = Rake(stopwords=stopwords.words('english'))
        rake.extract_keywords_from_text(text)
        ranked = rake.get_ranked_phrases()
        print(f"RAKE found {len(ranked)} initial phrases")
        
        # Optionally filter out phrases by length (e.g., too short or too long phrases)
        filtered_by_length = [phrase for phrase in ranked if 3 <= len(phrase) <= 100]
        print(f"After length filtering: {len(filtered_by_length)} phrases")
        
        # Filter out similar phrases using the effective threshold and chosen method.
        unique = filter_similar_phrases(filtered_by_length, effective_threshold, similarity_method)
        print(f"After similarity filtering: {len(unique)} unique concepts")
        
        # Return the top concepts based on the requested number.
        result = unique[:num_concepts]
        print(f"Final concepts extracted: {result}")
        return result
    except Exception as e:
        print(f"Error extracting key concepts: {e}")
        return []
