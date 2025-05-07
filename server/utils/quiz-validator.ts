/**
 * Simple quiz validation utility to verify quiz answers
 */

/**
 * Validates a quiz answer against a correct answer
 * @param userAnswer The user's answer
 * @param correctAnswer The correct answer
 * @returns Boolean indicating if the answer is correct
 */
export function validateQuizAnswer(userAnswer: string, correctAnswer: string): boolean {
  // Normalize answers by trimming and converting to lowercase
  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
  
  // Check for exact match
  if (normalizedUserAnswer === normalizedCorrectAnswer) {
    return true;
  }
  
  // For numerical answers, also check if the values are equal
  // This handles cases like "12" vs "12.0" or " 12"
  if (!isNaN(Number(normalizedUserAnswer)) && !isNaN(Number(normalizedCorrectAnswer))) {
    return Number(normalizedUserAnswer) === Number(normalizedCorrectAnswer);
  }
  
  return false;
}

/**
 * Generates a simple math quiz question
 * @returns An object with the question, options, and correct answer
 */
export function generateMathQuiz(): { question: string; options: string[]; correctAnswer: string } {
  const operations = [
    { op: '+', name: 'plus' },
    { op: '-', name: 'minus' },
    { op: '*', name: 'times' }
  ];

  // Choose a random operation
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  // Generate two numbers based on the operation
  let num1, num2;
  if (operation.op === '+') {
    num1 = Math.floor(Math.random() * 10) + 1; // 1-10
    num2 = Math.floor(Math.random() * 10) + 1; // 1-10
  } else if (operation.op === '-') {
    num1 = Math.floor(Math.random() * 15) + 5; // 5-19
    num2 = Math.floor(Math.random() * num1) + 1; // 1 to num1
  } else { // multiplication
    num1 = Math.floor(Math.random() * 9) + 2; // 2-10
    num2 = Math.floor(Math.random() * 5) + 2; // 2-6
  }

  // Calculate the correct answer
  let answer;
  if (operation.op === '+') {
    answer = num1 + num2;
  } else if (operation.op === '-') {
    answer = num1 - num2;
  } else {
    answer = num1 * num2;
  }

  // Generate the question
  const question = `What is ${num1} ${operation.name} ${num2}?`;
  
  // Generate options (including the correct answer)
  const options = [answer.toString()];
  
  // Add incorrect options
  while (options.length < 4) {
    let incorrectAnswer;
    
    if (operation.op === '+') {
      incorrectAnswer = answer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
    } else if (operation.op === '-') {
      incorrectAnswer = answer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
    } else {
      incorrectAnswer = answer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
    }
    
    // Ensure the incorrect answer is positive
    incorrectAnswer = Math.max(1, incorrectAnswer);
    
    // Add the incorrect answer if it's not already in the options
    if (!options.includes(incorrectAnswer.toString())) {
      options.push(incorrectAnswer.toString());
    }
  }
  
  // Shuffle the options
  options.sort(() => Math.random() - 0.5);
  
  return {
    question,
    options,
    correctAnswer: answer.toString(),
  };
}
