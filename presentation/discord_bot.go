package presentation

import (
	"hysbysu/internal"
	"hysbysu/model"
	"log"
	"time"

	"github.com/bwmarrin/discordgo"
)

type DiscordBot struct {
	config  internal.Config
	discord *discordgo.Session
}

func NewDiscordBot(config internal.Config) (*DiscordBot, error) {
	discord, err := discordgo.New("Bot " + config.DiscordToken)
	if err != nil {
		return nil, err
	}
	discord.Identify.Intents = discordgo.IntentGuildMessages

	log.Println("discord client starting...")
	err = discord.Open()
	if err != nil {
		return nil, err
	}

	return &DiscordBot{config, discord}, nil
}

func (bot DiscordBot) Notify(subject model.Subject) error {
	for _, meeting := range subject.Meetings {
		embed := &discordgo.MessageEmbed{
			Title: "📚 Inpo baru gaes!!",
			Author: &discordgo.MessageEmbedAuthor{
				Name:    subject.Lecturer.Name,
				IconURL: subject.Lecturer.ImageUrl,
			},
			Color: 0x61afef,
			// Description: "Ada tugas dari bu",
			Fields: []*discordgo.MessageEmbedField{
				{Name: "Title", Value: meeting.Title},
				{Name: "Subject", Value: meeting.Subject},
			},
			Thumbnail: &discordgo.MessageEmbedThumbnail{
				URL: "https://media.discordapp.net/attachments/1034341084735754260/1034370197429157888/unknown.png",
			},
			Timestamp: time.Now().Format(time.RFC3339),
			Footer: &discordgo.MessageEmbedFooter{
				Text: "kalo ada tugas buru dikerjain, gausah ditunda tunda",
			},
		}

		assignments := bot.buildLectureList(meeting.Lectures, model.LectureAssignment)
		if len(assignments) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Assignments",
				Value: assignments,
			})
		}

		resources := bot.buildLectureList(meeting.Lectures, model.LectureResource)
		if len(resources) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Resources",
				Value: resources,
			})
		}

		quizzes := bot.buildLectureList(meeting.Lectures, model.LectureQuiz)
		if len(quizzes) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Quizzes",
				Value: quizzes,
			})
		}

		externalResource := bot.buildLectureList(meeting.Lectures, model.LectureUrl)
		if len(externalResource) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "External Resources",
				Value: externalResource,
			})
		}

		log.Println("sending message to " + bot.config.DiscordChannelId)
		_, err := bot.discord.ChannelMessageSendEmbed(bot.config.DiscordChannelId, embed)
		if err != nil {
			log.Printf("failed to send message to discord. reason: %v", err)
		}
	}

	return nil
}

func (bot DiscordBot) buildLectureList(lectures []model.Lecture, lectureType model.LectureType) string {
	output := ""
	for _, lecture := range lectures {
		if lecture.Type == lectureType {
			output += "• [" + lecture.Name + "](" + lecture.Url + ")\n"
		}
	}
	return output
}
