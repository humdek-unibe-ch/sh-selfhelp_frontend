// src/services/page.service.ts
class PageService {
    private static instance: PageService;
    private currentKeyword: string = '';

    private constructor() {}

    static getInstance(): PageService {
        if (!PageService.instance) {
            PageService.instance = new PageService();
        }
        return PageService.instance;
    }

    setKeyword(keyword: string) {
        this.currentKeyword = keyword;
    }

    getKeyword(): string {
        return this.currentKeyword;
    }
    
}

export const pageService = PageService.getInstance();