import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoffeesModule } from './coffees/coffees.module';


@Module({
  imports: [CoffeesModule, TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'localhost',
    port: 15432,
    username: 'postgres',
    password: 'mysecretpassword',
    database: 'postgres',
    autoLoadEntities: true,
    synchronize: true,
  }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
