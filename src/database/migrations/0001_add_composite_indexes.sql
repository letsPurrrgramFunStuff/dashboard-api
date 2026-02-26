CREATE INDEX "alert_org_dismissed_created_idx" ON "alerts" USING btree ("organization_id","dismissed_at","created_at");--> statement-breakpoint
CREATE INDEX "alert_org_read_dismissed_idx" ON "alerts" USING btree ("organization_id","is_read","dismissed_at");--> statement-breakpoint
CREATE INDEX "property_org_deleted_risk_idx" ON "properties" USING btree ("organization_id","deleted_at","risk_score");--> statement-breakpoint
CREATE INDEX "task_org_deleted_created_idx" ON "tasks" USING btree ("organization_id","deleted_at","created_at");--> statement-breakpoint
CREATE INDEX "task_org_status_deleted_idx" ON "tasks" USING btree ("organization_id","status","deleted_at");