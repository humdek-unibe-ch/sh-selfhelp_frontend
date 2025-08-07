import React, { useState } from 'react';
import type { IQuizStyle } from '../../../types/common/styles.types';
import { Box, Button, Text, Alert, Group } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import BasicStyle from './BasicStyle';

interface IQuizStyleProps {
    style: IQuizStyle;
}

const QuizStyle: React.FC<IQuizStyleProps> = ({ style }) => {
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    
    const type = style.type?.content || 'multiple-choice';
    const caption = style.caption?.content;
    const labelRight = style.label_right?.content || 'Correct!';
    const labelWrong = style.label_wrong?.content || 'Incorrect!';
    const rightContent = style.right_content?.content;
    const wrongContent = style.wrong_content?.content;
    
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    const handleAnswer = (correct: boolean) => {
        setIsCorrect(correct);
        setShowResult(true);
    };

    const resetQuiz = () => {
        setShowResult(false);
        setIsCorrect(false);
    };

    return (
        <Box className={style.css}>
            {caption && (
                <Text size="lg" fw={500} mb="md">
                    {caption}
                </Text>
            )}
            
            {!showResult ? (
                <Box>
                    {children.map((childStyle, index) => (
                        childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
                    ))}
                    
                    <Group mt="md">
                        <Button 
                            color="green" 
                            leftSection={<IconCheck size={16} />}
                            onClick={() => handleAnswer(true)}
                        >
                            True
                        </Button>
                        <Button 
                            color="red" 
                            leftSection={<IconX size={16} />}
                            onClick={() => handleAnswer(false)}
                        >
                            False
                        </Button>
                    </Group>
                </Box>
            ) : (
                <Box>
                    <Alert 
                        color={isCorrect ? 'green' : 'red'}
                        icon={isCorrect ? <IconCheck size={16} /> : <IconX size={16} />}
                        title={isCorrect ? labelRight : labelWrong}
                        mb="md"
                    >
                        {isCorrect ? rightContent : wrongContent}
                    </Alert>
                    
                    <Button variant="outline" onClick={resetQuiz}>
                        Try Again
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default QuizStyle; 