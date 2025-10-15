import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_ADMIN_KEY } from './admin.decorator';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const isAdminMeta = this.reflector.getAllAndOverride<boolean>(
      IS_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If route isn't marked admin-only, allow
    if (!isAdminMeta) return true;

    // Obtain request (support GraphQL and HTTP)
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    const req = ctx?.req || context.switchToHttp().getRequest();

    const user = req?.user;

    if (!user || !user.isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    return true;
  }
}
