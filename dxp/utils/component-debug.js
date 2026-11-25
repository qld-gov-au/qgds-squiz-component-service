export function isDebugTimingEnabled() {
    return process.env.CMP_DEBUG_TIMING === 'true';
}

export function createComponentDebugMark(componentName = 'component') {
    const debugStart = Date.now();
    const prefix = `[CMP DEBUG]${componentName ? ` ${componentName}` : ''}`;

    if (!isDebugTimingEnabled()) {
        return () => {};
    }

    return (action) => console.debug(`${prefix} ${action} (+${Date.now() - debugStart}ms)`);
}
