export class Order {
    id: string;
    customerId: string;
    orderId: string;
    orderStatus: string;
    totalValue: number;
    items: Array<OrderItem>;
    paymentStatus: string;
    createdAt: Date;
    updatedAt: Date;
}

type OrderItem = {
    item_value: number;
    name: string;
    item_id: string;
};
