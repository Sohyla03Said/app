from ctransformers import AutoModelForCausalLM
import os
from typing import Optional

class LLMManager:
    def __init__(self):
        self.model = None
        self.model_path = None
        self.is_loaded = False
        
    def load_model(self, model_path: str = None):
        """Load the Mistral 7B model from the specified path"""
        if self.is_loaded:
            return True
        
        if model_path is None:
            # Use the absolute path to your model
            model_path = r"E:\offline-edu-app\models\mistral-7b-instruct-v0.2.Q4_K_M.gguf"
        
        print(f"📂 Model path: {model_path}")
        print(f"📂 Checking if file exists...")
        
        if not os.path.exists(model_path):
            print(f"❌ Model file not found at: {model_path}")
            print(f"⚠️  Running in demo mode. AI responses will be simulated.")
            self.is_loaded = False
            return False
        
        print(f"✅ Model file found! Loading Mistral 7B...")
        print(f"⏳ This may take 30-60 seconds on first load...")
        
        try:
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path,
                model_type="mistral",
                gpu_layers=0,  # Set to number > 0 if you have CUDA GPU
                context_length=2048,
                max_new_tokens=512,
                temperature=0.7,
                threads=4  # Adjust based on your CPU cores
            )
            self.model_path = model_path
            self.is_loaded = True
            print("✅ Mistral 7B loaded successfully!")
            print("🤖 Real AI responses are now active!")
            return True
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            print(f"⚠️  Running in demo mode.")
            self.is_loaded = False
            return False
    
    def generate(self, prompt: str, max_tokens: int = 512, temperature: float = 0.7) -> str:
        """Generate a response from the model"""
        if not self.is_loaded or self.model is None:
            return "AI model not loaded. This is a demo response. Please ensure the model file is in the models folder."
        
        try:
            # Format prompt for Mistral Instruct format
            formatted_prompt = f"<s>[INST] {prompt} [/INST]"
            
            response = self.model(
                formatted_prompt,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=0.95,
                repetition_penalty=1.1,
                stop=["</s>", "[INST]"]
            )
            
            return response.strip()
        except Exception as e:
            print(f"❌ Error generating response: {e}")
            return f"Error generating response: {str(e)}"
    
    def chat(self, messages: list, max_tokens: int = 512, temperature: float = 0.7, context: Optional[str] = None) -> str:
        """Generate a chat response based on conversation history"""
        conversation = ""
        
        if context:
            conversation = f"Context: {context}\n\n"
        
        # Use last 5 messages to avoid context overflow
        for msg in messages[-5:]:
            role = msg.get("role")
            content = msg.get("content")
            
            if role == "user":
                conversation += f"User: {content}\n"
            elif role == "assistant":
                conversation += f"Assistant: {content}\n"
        
        conversation += "Respond as a helpful AI assistant:"
        
        return self.generate(conversation, max_tokens, temperature)
    
    def summarize(self, text: str, style: str = "detailed") -> str:
        """Summarize text with different styles"""
        style_prompts = {
            "simple": "Provide a brief, simple summary in 2-3 sentences:",
            "detailed": "Provide a comprehensive summary covering all main points:",
            "examples": "Summarize with practical examples:"
        }
        
        prompt = f"{style_prompts.get(style, style_prompts['detailed'])}\n\n{text[:3000]}\n\nSummary:"
        return self.generate(prompt, max_tokens=300, temperature=0.5)
    
    def explain(self, text: str, level: str = "detailed") -> str:
        """Explain text at different complexity levels"""
        level_prompts = {
            "simple": "Explain in very simple terms that a beginner can understand:",
            "detailed": "Provide a detailed explanation with technical details:",
            "examples": "Explain with clear, practical examples:"
        }
        
        prompt = f"{level_prompts.get(level, level_prompts['detailed'])}\n\n{text}\n\nExplanation:"
        return self.generate(prompt, max_tokens=400, temperature=0.6)
    
    def generate_questions(self, content: str, question_type: str, num_questions: int = 5) -> list:
        """Generate different types of questions from content"""
        type_instructions = {
            "mcq": "Generate multiple-choice questions with 4 options each. Format each as: Question text | A) option | B) option | C) option | D) option | Correct: X",
            "true_false": "Generate true/false questions. Format: Statement | Answer: True/False",
            "essay": "Generate essay questions that require detailed answers."
        }
        
        instruction = type_instructions.get(question_type, type_instructions["mcq"])
        
        prompt = f"""{instruction}

Generate exactly {num_questions} questions based on this content:

{content[:2000]}

Questions:"""
        
        response = self.generate(prompt, max_tokens=600, temperature=0.7)
        return self._parse_questions(response, question_type)
    
    def _parse_questions(self, response: str, question_type: str) -> list:
        """Parse generated questions into structured format"""
        questions = []
        lines = [line.strip() for line in response.split('\n') if line.strip()]
        
        for line in lines[:5]:
            if question_type == "mcq" and "|" in line:
                parts = [p.strip() for p in line.split("|")]
                if len(parts) >= 5:
                    questions.append({
                        "type": "mcq",
                        "question": parts[0],
                        "options": parts[1:5],
                        "correct": parts[5] if len(parts) > 5 else "A"
                    })
            elif question_type == "true_false":
                if "|" in line:
                    parts = line.split("|")
                    questions.append({
                        "type": "true_false",
                        "question": parts[0].strip(),
                        "correct": "True" if "true" in parts[1].lower() else "False"
                    })
                else:
                    questions.append({
                        "type": "true_false",
                        "question": line,
                        "correct": "True"
                    })
            else:
                if len(line) > 10:
                    questions.append({
                        "type": "essay",
                        "question": line
                    })
        
        # Fallback if parsing fails
        if len(questions) == 0:
            questions = [
                {"type": question_type, "question": f"Sample question {i+1}", "correct": "A"} 
                for i in range(3)
            ]
        
        return questions
    
    def evaluate_answer(self, question: str, correct_answer: str, student_answer: str) -> dict:
        """Evaluate a student's answer and provide feedback"""
        prompt = f"""Evaluate this student's answer:

Question: {question}
Expected Answer: {correct_answer}
Student's Answer: {student_answer}

Is the answer correct? Provide brief feedback and suggestions.
Start with "CORRECT:" or "INCORRECT:" then explain."""
        
        response = self.generate(prompt, max_tokens=200, temperature=0.5)
        
        # Check if response indicates correct answer
        is_correct = "correct:" in response.lower()[:50] and "incorrect" not in response.lower()[:50]
        
        return {
            "is_correct": is_correct,
            "feedback": response,
            "score": 1.0 if is_correct else 0.0
        }

# Create global instance
llm_manager = LLMManager()