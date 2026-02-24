export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'levelup') {
    if (!navigator.vibrate) return;
    const patterns: Record<string, number | number[]> = {
        light: 10,
        medium: 30,
        heavy: [50, 30, 50],
        success: [20, 10, 20],
        levelup: [50, 30, 50, 30, 100],
    };
    navigator.vibrate(patterns[type] as number | number[]);
}
