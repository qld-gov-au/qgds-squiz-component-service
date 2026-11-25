export default function getClasses(classesConfig = {}) {
    return Object.entries(classesConfig)
        .reduce((acc, [className, enabled]) => {
            if (!enabled) {
                return acc;
            }

            if (acc.includes(className)) {
                return acc;
            }

            return [...acc, className];
        }, [])
        .join(' ');
}
