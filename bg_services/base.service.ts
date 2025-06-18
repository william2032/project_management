import { Logger } from '@nestjs/common';

export abstract class BaseBackgroundService {
    protected readonly logger: Logger;

    constructor(serviceName: string) {
        this.logger = new Logger(serviceName);
    }

    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
}