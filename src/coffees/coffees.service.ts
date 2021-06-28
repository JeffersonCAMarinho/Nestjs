import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Event } from 'src/events/entities/event.entity';
import { Connection, Repository } from 'typeorm';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { Coffee } from './entities/coffee.entity';
import { Flavor } from './entities/flavor.entity';

@Injectable()
export class CoffeesService {
    constructor(
        @InjectRepository(Coffee)
        private readonly coffeRepository: Repository<Coffee>,
        @InjectRepository(Flavor)
        private readonly flavorRepository: Repository<Flavor>,
        private readonly connection: Connection,    
    ){}

    findAll(paginationQuery: PaginationQueryDto){
        const {limit, offset} = paginationQuery;
        return this.coffeRepository.find({
            relations: ['flavors'],
            skip: offset,
            take: limit,
        });
    }
    async findOne(id: string){
        
        const coffee = await this.coffeRepository.findOne(id, {
            relations: ['flavors'],
        });
        if (!coffee){
            throw new NotFoundException(`Coffee #${id} not found`);
        }
        return coffee;
    }
    async create(createCoffeeDto: CreateCoffeeDto){
        const flavors = await Promise.all(
        createCoffeeDto.flavors.map(name => this.preloadFlavorByName(name)),
        );

        const coffee = this.coffeRepository.create({
            ...createCoffeeDto,
            flavors,
        });
        return this.coffeRepository.save(coffee);
    }
    async update(id: string, updateCoffeeDto: UpdateCoffeeDto){
        const flavors = 
        updateCoffeeDto.flavors && 
        (await Promise.all(
             updateCoffeeDto.flavors.map(name => this.preloadFlavorByName(name)),
        ));

        const coffee = await this.coffeRepository.preload({
            id: +id,
            ...updateCoffeeDto,
            flavors,
        });
        if (!coffee) {
            throw new NotFoundException(`Coffee #${id} not found`);
        }
        return this.coffeRepository.save(coffee);
    }
    async remove(id: string){
        const coffee = await this.findOne(id);
        return this.coffeRepository.remove(coffee);
    }
    async recommendedCoffee(coffee: Coffee){
        const queryRunner = await this.connection.createQueryRunner();
        
        await queryRunner.connect()
        await queryRunner.startTransaction()
        try {
            coffee.recommendations++;

            const recommendEvent = new Event();
            recommendEvent.name = 'recommend_coffee';
            recommendEvent.type = 'coffee';
            recommendEvent.payload = {coffeeId: coffee.id};

            await queryRunner.manager.save(coffee);
            await queryRunner.manager.save(recommendEvent);

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
        }finally{
            await queryRunner.release();
        }
    }

    private async preloadFlavorByName(name:string): Promise<Flavor>{
        const existingFlavor = await this.flavorRepository.findOne({name});
        if (existingFlavor){
            return existingFlavor;
        }
        return this.flavorRepository.create({name});
    }
}
