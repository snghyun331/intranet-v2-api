import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap } from 'rxjs';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const request: any = context.switchToHttp().getRequest();
    request.queryRunnerManager = queryRunner.manager;

    return next.handle().pipe(
      catchError(async (e) => {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();

        if (e instanceof HttpException) {
          throw new HttpException(e.getResponse(), e.getStatus());
        }
        throw new InternalServerErrorException();
      }),
      tap(async () => {
        await queryRunner.commitTransaction();
        await queryRunner.release();
      }),
    );
  }
}
