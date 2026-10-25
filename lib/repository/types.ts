import type { Application, NewApplication, Status } from "@/lib/validation/application";
import type { Contact, NewContact } from "@/lib/validation/contact";
import type { Interaction, NewInteraction } from "@/lib/validation/interaction";
import type { StatusEvent } from "@/lib/analytics/types";

export interface ApplicationRepository {
  list(userId: string): Promise<Application[]>;
  get(userId: string, id: string): Promise<Application | null>;
  create(userId: string, input: NewApplication): Promise<Application>;
  createMany(userId: string, inputs: NewApplication[]): Promise<Application[]>;
  update(userId: string, id: string, input: Partial<NewApplication>): Promise<Application>;
  move(userId: string, id: string, status: Status, position: number): Promise<void>;
  remove(userId: string, id: string): Promise<void>;
}

export interface ActivityRepository {
  listContacts(userId: string, applicationId: string): Promise<Contact[]>;
  addContact(userId: string, applicationId: string, input: NewContact): Promise<Contact>;
  listInteractions(userId: string, applicationId: string): Promise<Interaction[]>;
  addInteraction(
    userId: string,
    applicationId: string,
    input: NewInteraction,
  ): Promise<Interaction>;
}

export interface StatusEventRepository {
  listForUser(userId: string): Promise<StatusEvent[]>;
}